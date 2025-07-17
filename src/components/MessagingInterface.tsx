"use client";

import { useSocket } from "@/hooks/useSocket";
import React, { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: "incoming" | "outgoing";
  status?: "sent" | "delivered" | "read";
  isGroupMsg?: boolean;
  revoked?: boolean;
}

interface Contact {
  number: string;
  name?: string;
  lastSeen?: number;
  typing?: boolean;
  typingStatus?: string;
  isOnline?: boolean;
}

export default function MessagingInterface() {
  const { state, actions } = useSocket();
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Join session room when session is selected
  useEffect(() => {
    if (selectedSession) {
      console.log(`🔄 Selected session: ${selectedSession}, joining room...`);
      actions.joinSession(selectedSession);
    }
  }, [selectedSession, actions]);

  // Process incoming messages from WebSocket
  useEffect(() => {
    console.log("💬 Processing incoming messages:", state.messages.length);
    const incomingMessages = state.messages.map((msg) => ({
      id: msg.id,
      from: msg.from,
      to: msg.to,
      body: msg.body,
      timestamp: msg.timestamp,
      type: "incoming" as const,
      isGroupMsg: msg.isGroupMsg,
      revoked: msg.revoked,
    }));

    setChatMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newMessages = incomingMessages.filter(
        (m) => !existingIds.has(m.id)
      );
      console.log(`🆕 Found ${newMessages.length} new messages`);

      // Mark new messages as read if they are from the selected contact
      if (selectedSession && selectedContact) {
        newMessages.forEach((msg) => {
          if (msg.from === selectedContact) {
            try {
              actions.markMessageAsRead(selectedSession, msg.id);
            } catch (error) {
              console.error("Error marking message as read:", error);
            }
          }
        });
      }

      return [...prev, ...newMessages];
    });

    // Update contacts list
    const newContacts = Array.from(
      new Set(state.messages.map((msg) => msg.from))
    ).map((number) => ({
      number,
      name: number.includes("@g.us") ? "Group Chat" : undefined,
      lastSeen: Math.max(
        ...state.messages
          .filter((msg) => msg.from === number)
          .map((msg) => msg.timestamp)
      ),
    }));

    setContacts((prev) => {
      const contactMap = new Map(prev.map((c) => [c.number, c]));
      newContacts.forEach((contact) => {
        if (
          !contactMap.has(contact.number) ||
          (contactMap.get(contact.number)?.lastSeen || 0) < contact.lastSeen
        ) {
          contactMap.set(contact.number, contact);
        }
      });
      return Array.from(contactMap.values()).sort(
        (a, b) => (b.lastSeen || 0) - (a.lastSeen || 0)
      );
    });
  }, [state.messages, selectedContact, selectedSession]);

  // Update message status from acknowledgments
  useEffect(() => {
    state.messageAcks.forEach((ack) => {
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === ack.messageId ? { ...msg, status: ack.status } : msg
        )
      );
    });
  }, [state.messageAcks]);

  // Update typing status
  useEffect(() => {
    if (state.typingStatus && state.typingStatus.length > 0) {
      setContacts((prev) => {
        const updatedContacts = [...prev];
        state.typingStatus.forEach((status) => {
          const contactIndex = updatedContacts.findIndex(
            (c) => c.number === status.from
          );
          if (contactIndex !== -1) {
            updatedContacts[contactIndex] = {
              ...updatedContacts[contactIndex],
              typing: true,
              typingStatus: status.status,
            };
          }
        });
        return updatedContacts;
      });
    } else {
      // Clear typing status if there are no active typing indicators
      setContacts((prev) =>
        prev.map((contact) => ({
          ...contact,
          typing: false,
          typingStatus: undefined,
        }))
      );
    }
  }, [state.typingStatus]);

  // Update presence information
  useEffect(() => {
    if (state.presenceUpdates && state.presenceUpdates.length > 0) {
      setContacts((prev) => {
        const updatedContacts = [...prev];

        state.presenceUpdates.forEach((presence) => {
          // Extract the number from the ID (format: number@c.us)
          const number = presence.id;

          const contactIndex = updatedContacts.findIndex(
            (c) => c.number === number
          );

          if (contactIndex !== -1) {
            updatedContacts[contactIndex] = {
              ...updatedContacts[contactIndex],
              isOnline: presence.isOnline,
              lastSeen:
                presence.lastSeen || updatedContacts[contactIndex].lastSeen,
            };
          }
        });

        return updatedContacts;
      });
    }
  }, [state.presenceUpdates]);

  // Subscribe to presence updates when a contact is selected
  useEffect(() => {
    if (selectedContact && selectedSession) {
      try {
        actions.subscribeToPresence(selectedSession, selectedContact);
      } catch (error) {
        console.error("Error subscribing to presence:", error);
      }
    }
  }, [selectedContact, selectedSession, actions]);

  // Update revoked messages
  useEffect(() => {
    if (state.revokedMessages && state.revokedMessages.length > 0) {
      setChatMessages((prev) => {
        return prev.map((msg) => {
          const isRevoked = state.revokedMessages.some(
            (revoked) => revoked.messageId === msg.id
          );
          return isRevoked ? { ...msg, revoked: true } : msg;
        });
      });
    }
  }, [state.revokedMessages]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);

    // Send typing indicator with debouncing
    if (selectedContact && selectedSession) {
      // Clear previous timeout if exists
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Only send typing indicator if not already typing
      if (!isTyping) {
        setIsTyping(true);

        try {
          actions.sendTypingIndicator(selectedSession, selectedContact);
        } catch (error) {
          console.error("Error sending typing indicator:", error);
        }
      }

      // Set typing to false after 3 seconds
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 3000);

      setTypingTimeout(timeout);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact || !selectedSession) return;

    setIsLoading(true);
    try {
      console.log("Sending message to:", selectedContact);

      // Ensure phone number is properly formatted
      const formattedNumber = selectedContact.includes("@")
        ? selectedContact
        : `${selectedContact.replace(/\D/g, "")}@c.us`;

      const response = await actions.sendMessage(
        selectedSession,
        formattedNumber,
        messageText.trim()
      );

      console.log("Send message response:", response);

      if (response && response.success && response.data?.messageId) {
        // Add outgoing message to chat
        const outgoingMessage: ChatMessage = {
          id: response.data.messageId,
          from: selectedSession,
          to: formattedNumber,
          body: messageText.trim(),
          timestamp: Date.now(),
          type: "outgoing",
          status: "sent",
        };

        setChatMessages((prev) => [...prev, outgoingMessage]);
        setMessageText("");

        // Reset typing state
        setIsTyping(false);
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
      } else {
        const errorMsg = response?.error || "Unknown error";
        console.error("Failed to send message:", errorMsg);
        alert(`Failed to send message: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        `Error sending message: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return formatTime(timestamp);
    }

    // If yesterday, show "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // If this week, show day name
    const daysDiff = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff < 7) {
      return date.toLocaleDateString(undefined, { weekday: "long" });
    }

    // Otherwise, show date
    return date.toLocaleDateString();
  };

  const formatNumber = (number: string) => {
    return number.includes("@g.us")
      ? number.split("@")[0] + " (Group)"
      : number.split("@")[0];
  };

  const getFilteredMessages = () => {
    if (!selectedContact) return [];
    return chatMessages
      .filter(
        (msg) => msg.from === selectedContact || msg.to === selectedContact
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sent":
        return <span className="text-gray-400">✓</span>;
      case "delivered":
        return <span className="text-gray-400">✓✓</span>;
      case "read":
        return <span className="text-blue-500">✓✓</span>;
      default:
        return <span className="text-gray-400">⏳</span>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Sessions and Contacts */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        {/* Session Selector */}
        <div className="p-4 border-b bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select WhatsApp Session:
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            title="Select WhatsApp Session"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose session...</option>
            {state.sessions
              .filter((s) => s.status === "ready")
              .map((session) => (
                <option key={session.id} value={session.id}>
                  {session.clientInfo?.pushname || session.id} ({session.status}
                  )
                </option>
              ))}
          </select>
        </div>

        {/* Connection Status */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                state.isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {state.isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          {state.connectionError && (
            <div className="mt-2 text-sm text-red-500">
              {state.connectionError}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="p-2 border-b bg-gray-50">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-1 p-2 bg-gray-100 rounded">
              <p>Messages in state: {state.messages.length}</p>
              <p>Messages in UI: {chatMessages.length}</p>
              <p>Connected: {state.isConnected ? "Yes" : "No"}</p>
              <p>Selected Session: {selectedSession || "None"}</p>
            </div>
          </details>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-medium text-gray-900">Recent Contacts</h3>
          </div>
          {contacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.number}
                onClick={() => setSelectedContact(contact.number)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedContact === contact.number
                    ? "bg-blue-50 border-blue-200"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-gray-900">
                    {contact.name || formatNumber(contact.number)}
                  </div>
                  {contact.isOnline && (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {formatNumber(contact.number)}
                </div>
                {contact.typing && (
                  <div className="text-xs text-green-500 font-medium animate-pulse">
                    {contact.typingStatus === "recording"
                      ? "Recording..."
                      : "Typing..."}
                  </div>
                )}
                {!contact.typing && contact.lastSeen && (
                  <div className="text-xs text-gray-400">
                    {contact.isOnline
                      ? "Online"
                      : `Last seen: ${formatDate(contact.lastSeen)}`}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Manual Contact Input */}
        <div className="p-4 border-t bg-gray-50">
          <input
            type="text"
            placeholder="Enter phone number (e.g., 1234567890)"
            value={selectedContact.includes("@") ? "" : selectedContact}
            onChange={(e) => {
              const number = e.target.value.replace(/\D/g, "");
              setSelectedContact(number ? `${number}@c.us` : "");
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 bg-white border-b">
          {selectedContact ? (
            <div>
              <div className="flex items-center">
                <h2 className="font-medium text-gray-900">
                  {formatNumber(selectedContact)}
                </h2>
                {contacts.find((c) => c.number === selectedContact)
                  ?.isOnline && (
                  <span className="ml-2 text-xs text-green-500">online</span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Session: {selectedSession || "Not selected"}
              </p>
            </div>
          ) : (
            <div className="text-gray-500">
              Select a contact to start messaging
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedContact ? (
            getFilteredMessages().length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              getFilteredMessages().map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "outgoing"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.revoked
                        ? "bg-gray-100 text-gray-500 italic"
                        : message.type === "outgoing"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <div className="break-words">
                      {message.revoked
                        ? "This message was deleted"
                        : message.body}
                    </div>
                    <div
                      className={`text-xs mt-1 flex items-center justify-between ${
                        message.type === "outgoing"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{formatTime(message.timestamp)}</span>
                      {message.type === "outgoing" && !message.revoked && (
                        <span className="ml-2">
                          {getStatusIcon(message.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="text-center text-gray-500 py-8">
              👈 Select a contact from the sidebar to view messages
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {selectedContact && selectedSession && (
          <div className="p-4 bg-white border-t">
            <div className="flex space-x-2">
              <textarea
                value={messageText}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || isLoading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

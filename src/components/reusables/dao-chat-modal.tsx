import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  X,
  MessageSquare,
  FileText,
  Timer,
  CheckCircle2,
  FileEdit,
  XCircle,
  Link as LinkIcon,
  Code,
  DollarSign,
  Filter,
  Hash,
  Wallet,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

interface Proposal {
  id: string;
  created_at: string;
  title: string;
  description: string;
  code: string | null;
  link: string | null;
  monetary_ask: null;
  status: "DRAFT" | "PENDING" | "DEPLOYED" | "FAILED";
  contract_principal: string;
  tx_id: string;
  dao_id: string;
}

interface DAOChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  daoId: string;
  daoName: string;
}

// Message Item Component
const MessageItem = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100"
        }`}
      >
        <p>{message.content}</p>
        <p className="text-xs mt-1 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: Proposal["status"] }) => {
  const config = {
    DRAFT: {
      color: "bg-gray-500/10 text-gray-500",
      icon: FileEdit,
      label: "Draft",
    },
    PENDING: {
      color: "bg-blue-500/10 text-blue-500",
      icon: Timer,
      label: "Pending",
    },
    DEPLOYED: {
      color: "bg-green-500/10 text-green-500",
      icon: CheckCircle2,
      label: "Deployed",
    },
    FAILED: {
      color: "bg-red-500/10 text-red-500",
      icon: XCircle,
      label: "Failed",
    },
  };

  const { color, icon: Icon, label } = config[status];

  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </div>
  );
};

// Proposal Card Component
const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEstimatedEndDate = (createdAt: string): Date => {
    const start = new Date(createdAt);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000);
  };

  const truncateString = (str: string, length: number) => {
    if (str.length <= length) return str;
    return `${str.substring(0, length)}...`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{proposal.title}</h3>
            <p className="text-sm text-gray-500">
              {isExpanded
                ? proposal.description
                : truncateString(proposal.description, 100)}
            </p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500">
                <Timer className="h-4 w-4" />
                <span>
                  Created: {formatDate(new Date(proposal.created_at))}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Timer className="h-4 w-4" />
                <span>
                  Ends: {formatDate(getEstimatedEndDate(proposal.created_at))}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {proposal.code && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Code className="h-4 w-4" />
                  <span title={proposal.code}>
                    Code: {truncateString(proposal.code, 15)}
                  </span>
                </div>
              )}
              {proposal.link && (
                <div className="flex items-center gap-2 text-gray-500">
                  <LinkIcon className="h-4 w-4" />
                  <a
                    href={proposal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    External reference
                  </a>
                </div>
              )}
              {proposal.monetary_ask && (
                <div className="flex items-center gap-2 text-gray-500">
                  <DollarSign className="h-4 w-4" />
                  <span>Includes funding request</span>
                </div>
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="grid grid-cols-1 gap-2 text-sm bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Hash className="h-4 w-4" />
                <span className="font-mono">TX: {proposal.tx_id}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Wallet className="h-4 w-4" />
                <span className="font-mono">
                  Principal: {proposal.contract_principal}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <button
        className="text-xs text-blue-600 mt-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
};

export function DAOChatModal({
  isOpen,
  onClose,
  daoId,
  daoName,
}: DAOChatModalProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "proposals">("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [statusFilter, setStatusFilter] = useState<Proposal["status"] | "all">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate fetching messages and proposals
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Initialize with welcome message
        setMessages([
          {
            id: "1",
            content: `Welcome to the ${daoName} DAO chat! How can I assist you today?`,
            role: "assistant",
            timestamp: new Date().toISOString(),
          },
        ]);

        // Simulate fetching proposals
        setProposals([]);

        setIsConnected(true);
      } catch (err) {
        setError("Failed to load data. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, daoId, daoName]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!message.trim() || !isConnected) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'm the ${daoName} DAO assistant. I've received your message and I'm processing it.`,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  }, [message, isConnected, daoName]);

  const filteredProposals = proposals.filter(
    (proposal) => statusFilter === "all" || proposal.status === statusFilter
  );

  const stats = {
    active: proposals.filter((p) => p.status === "DEPLOYED").length,
    total: proposals.length,
    successRate:
      proposals.length > 0
        ? Math.round(
            (proposals.filter((p) => p.status === "DEPLOYED").length /
              Math.max(
                1,
                proposals.filter((p) => p.status !== "DRAFT").length
              )) *
              100
          )
        : 0,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90%] h-[90%] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">{daoName} DAO</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile Tabs */}
          <div className="md:hidden flex border-b">
            <button
              className={`flex-1 p-3 text-center ${
                activeTab === "chat" ? "border-b-2 border-blue-600" : ""
              }`}
              onClick={() => setActiveTab("chat")}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Chat
            </button>
            <button
              className={`flex-1 p-3 text-center ${
                activeTab === "proposals" ? "border-b-2 border-blue-600" : ""
              }`}
              onClick={() => setActiveTab("proposals")}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Proposals
            </button>
          </div>

          {/* Chat Section */}
          <div
            className={`flex-1 flex flex-col ${
              activeTab === "chat" ? "block" : "hidden"
            } md:block md:w-1/2 md:border-r`}
          >
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-red-50 text-red-500 p-4 rounded-md">
                  {error}
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t p-4">
                  <div className="flex">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Type your message..."
                      className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      disabled={!isConnected}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 text-white px-4 py-2 rounded-r-md disabled:bg-blue-300"
                      disabled={!isConnected}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Proposals Section */}
          <div
            className={`flex-1 overflow-y-auto p-4 ${
              activeTab === "proposals" ? "block" : "hidden"
            } md:block md:w-1/2`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {proposals.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Active Proposals
                        </h3>
                        <div className="text-2xl font-bold mt-2">
                          {stats.active}
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Success Rate
                        </h3>
                        <div className="text-2xl font-bold mt-2">
                          {stats.successRate}%
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Total Proposals
                        </h3>
                        <div className="text-2xl font-bold mt-2">
                          {stats.total}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Proposals</h3>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                          value={statusFilter}
                          onChange={(e) =>
                            setStatusFilter(
                              e.target.value as Proposal["status"] | "all"
                            )
                          }
                          className="border rounded-md px-2 py-1 text-sm"
                        >
                          <option value="all">All Proposals</option>
                          <option value="DRAFT">Draft</option>
                          <option value="PENDING">Pending</option>
                          <option value="DEPLOYED">Deployed</option>
                          <option value="FAILED">Failed</option>
                        </select>
                      </div>
                    </div>

                    {filteredProposals.map((proposal) => (
                      <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FileText className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No proposals yet
                    </h3>
                    <p className="text-gray-500">
                      This DAO doesn't have any proposals yet.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

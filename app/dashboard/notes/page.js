"use client";

import { useState, useEffect } from "react";

const COLORS = [
  { label: "White", value: "white", bg: "bg-white", border: "border-gray-200" },
  { label: "Yellow", value: "yellow", bg: "bg-yellow-50", border: "border-yellow-200" },
  { label: "Blue", value: "blue", bg: "bg-blue-50", border: "border-blue-200" },
  { label: "Green", value: "green", bg: "bg-green-50", border: "border-green-200" },
  { label: "Pink", value: "pink", bg: "bg-pink-50", border: "border-pink-200" },
  { label: "Purple", value: "purple", bg: "bg-purple-50", border: "border-purple-200" },
];

const PRIORITY_STYLES = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

function getColorClasses(colorValue) {
  return COLORS.find((c) => c.value === colorValue) || COLORS[0];
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
    color: "white",
    pinned: false,
    priority: "low",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTag, setFilterTag] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setNotes(data);
        setError("");
      } else {
        setNotes([]);
        setError(data.error || "Failed to load notes");
      }
    } catch {
      setNotes([]);
      setError("Failed to connect to server");
    } finally {
      setFetching(false);
    }
  };

  const openCreate = () => {
    setEditingNote(null);
    setFormData({ title: "", content: "", tags: "", color: "white", pinned: false, priority: "low" });
    setShowModal(true);
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: (note.tags || []).join(", "),
      color: note.color || "white",
      pinned: note.pinned || false,
      priority: note.priority || "low",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a title");
      return;
    }

    setLoading(true);
    try {
      const url = editingNote ? `/api/notes/${editingNote._id}` : "/api/notes";
      const method = editingNote ? "PUT" : "POST";

      const payload = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (editingNote) {
          // Update in-place without full refetch
          setNotes((prev) => prev.map((n) => (n._id === editingNote._id ? data : n)));
        } else {
          setNotes((prev) => [data, ...prev]);
        }
        setShowModal(false);
        setEditingNote(null);
      } else {
        alert(data.error || "Failed to save note");
      }
    } catch {
      alert("Failed to save note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n._id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete note");
      }
    } catch {
      alert("Failed to delete note. Please try again.");
    }
  };

  const handleTogglePin = async (note) => {
    try {
      const res = await fetch(`/api/notes/${note._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...note, tags: note.tags || [], pinned: !note.pinned }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotes((prev) => prev.map((n) => (n._id === note._id ? data : n)));
      }
    } catch {}
  };

  // All unique tags across notes
  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))];

  // Filter + sort
  const filtered = notes
    .filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
      const matchPriority = filterPriority === "all" || n.priority === filterPriority;
      const matchTag = !filterTag || (n.tags || []).includes(filterTag);
      return matchSearch && matchPriority && matchTag;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      return 0;
    });

  const pinnedCount = notes.filter((n) => n.pinned).length;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {notes.length} notes · {pinnedCount} pinned
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Note
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
          />
        </div>

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-700"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-700"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-700"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="title">Title A–Z</option>
          <option value="priority">By Priority</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center mb-6">
          <p className="text-red-600 mb-3">{error}</p>
          <button onClick={fetchNotes} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
            Try Again
          </button>
        </div>
      )}

      {/* Notes Grid */}
      {fetching ? (
        <div className="flex justify-center py-20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-gray-400">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-300 mb-3">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">{notes.length === 0 ? 'No notes yet. Click "New Note" to create one!' : "No notes match your filters."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((note) => {
            const colorClass = getColorClasses(note.color);
            return (
              <div
                key={note._id}
                className={`rounded-xl border ${colorClass.bg} ${colorClass.border} p-5 hover:shadow-md transition flex flex-col gap-3`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-gray-900 leading-snug flex-1">{note.title}</h3>
                  <button
                    onClick={() => handleTogglePin(note)}
                    title={note.pinned ? "Unpin" : "Pin"}
                    className={`mt-0.5 p-1 rounded transition ${note.pinned ? "text-yellow-500 hover:text-yellow-600" : "text-gray-300 hover:text-gray-500"}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={note.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                </div>

                {/* Content preview */}
                {note.content && (
                  <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                )}

                {/* Tags */}
                {note.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setFilterTag(tag === filterTag ? "" : tag)}
                        className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600 cursor-pointer hover:border-gray-400 transition"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-black/5 mt-auto">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[note.priority || "low"]}`}>
                      {note.priority || "low"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(note)}
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition"
                      title="Edit"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M4 20h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-white rounded-lg transition"
                      title="Delete"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13M9 3h6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              {editingNote ? "Edit Note" : "Create New Note"}
            </h2>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                placeholder="Note title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                placeholder="Write your note..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 resize-none"
              />
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
              <input
                type="text"
                placeholder="e.g. work, ideas, personal"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
              />
            </div>

            {/* Priority + Pin row */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">Pin this note</span>
                </label>
              </div>
            </div>

            {/* Color picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFormData({ ...formData, color: c.value })}
                    title={c.label}
                    className={`w-7 h-7 rounded-full border-2 transition ${c.bg} ${
                      formData.color === c.value ? "border-gray-900 scale-110" : "border-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setEditingNote(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {loading ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
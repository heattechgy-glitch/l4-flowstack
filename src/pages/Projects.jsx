import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Trash2, FolderOpen, AlertCircle } from "lucide-react";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setProjects(data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject() {
    if (!newProject.name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const { data, error: createError } = await supabase
        .from("projects")
        .insert([
          {
            name: newProject.name.trim(),
            description: newProject.description.trim(),
            status: "active",
          },
        ])
        .select();

      if (createError) throw createError;

      setProjects([data[0], ...projects]);
      setShowModal(false);
      setNewProject({ name: "", description: "" });
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProject(projectId, e) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      setDeleting(projectId);
      setError(null);
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (deleteError) throw deleteError;

      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  function handleProjectClick(projectId) {
    navigate(`/projects/${projectId}`);
  }

  function getStatusColor(status) {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "archived":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-gray-400">
              Manage your projects and workflows
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first project to get started
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-sky-500/50 transition-all cursor-pointer group relative"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status || "active"}
                  </span>
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    disabled={deleting === project.id}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded transition-all disabled:opacity-50"
                  >
                    {deleting === project.id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-400" />
                    )}
                  </button>
                </div>

                {/* Project Info */}
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {project.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="text-xs text-gray-500 mt-auto pt-4 border-t border-zinc-800">
                  Created{" "}
                  {new Date(project.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">
              Create New Project
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="My Awesome Project"
                  className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewProject({ name: "", description: "" });
                  setError(null);
                }}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProject.name.trim()}
                className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </div>
                ) : (
                  "Create Project"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

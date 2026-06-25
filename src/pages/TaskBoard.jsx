import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Plus, ArrowLeft, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TaskBoard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskColumn, setNewTaskColumn] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    if (!projectId) return;
    loadProject();
    loadTasks();
    subscribeToTasks();
  }, [projectId]);

  const loadProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    if (data) {
      setProjectName(data.name);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const subscribeToTasks = () => {
    const channel = supabase
      .channel(`tasks:project_id=eq.${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new : t))
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createTask = async (status) => {
    if (!newTaskTitle.trim()) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        project_id: projectId,
        title: newTaskTitle,
        status: status,
        priority: "medium",
      })
      .select()
      .single();

    if (data) {
      setNewTaskTitle("");
      setNewTaskColumn(null);
    }
  };

  const updateTask = async (taskId, updates) => {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    setEditingTask(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const columns = [
    { id: "todo", label: "To Do", status: "todo" },
    { id: "in_progress", label: "In Progress", status: "in_progress" },
    { id: "done", label: "Done", status: "done" },
  ];

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/projects")}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-sky-400">
                {projectName || "Task Board"}
              </h1>
              <p className="text-gray-400 mt-1">
                Manage tasks across your workflow
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading tasks...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-sky-400">
                      {column.label}
                    </h2>
                    <button
                      onClick={() => setNewTaskColumn(column.status)}
                      className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {newTaskColumn === column.status && (
                    <div className="mb-4">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            createTask(column.status);
                          } else if (e.key === "Escape") {
                            setNewTaskColumn(null);
                            setNewTaskTitle("");
                          }
                        }}
                        placeholder="Task title..."
                        autoFocus
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => createTask(column.status)}
                          className="px-3 py-1 bg-sky-500 hover:bg-sky-600 rounded text-sm transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setNewTaskColumn(null);
                            setNewTaskTitle("");
                          }}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  {getTasksByStatus(column.status).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setEditingTask(task)}
                      className="bg-gray-900 border border-gray-800 rounded-lg p-4 cursor-pointer hover:border-sky-500 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-white flex-1">
                          {task.title}
                        </h3>
                        <Flag
                          className={cn("w-4 h-4", getPriorityColor(task.priority))}
                        />
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-sky-400 mb-4">Edit Task</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={editingTask.description || ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={editingTask.status}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority
                </label>
                <select
                  value={editingTask.priority}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() =>
                  updateTask(editingTask.id, {
                    title: editingTask.title,
                    description: editingTask.description,
                    status: editingTask.status,
                    priority: editingTask.priority,
                  })
                }
                className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTask(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
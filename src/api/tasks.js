import { supabase } from "@/lib/supabaseClient";

export async function listTasks(projectId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTask(projectId, title, priority = "medium") {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title,
      priority,
      status: "todo",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

export function subscribeToTasks(projectId, callback) {
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
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
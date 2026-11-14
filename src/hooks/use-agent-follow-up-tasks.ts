"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  buildAgentFollowUpTask,
  type AgentFollowUpTask,
  type CreateAgentFollowUpTaskInput,
} from "@/domain/workflow-studio/agent-follow-up-tasks";
import {
  readFollowUpTasks,
  writeFollowUpTasks,
} from "@/lib/workflow-studio/follow-up-task-store";
import { createAgentFollowUpTaskAction } from "@/app/actions/workflow-studio";

export function useAgentFollowUpTasks(workflowId?: string) {
  const [tasks, setTasks] = useState<AgentFollowUpTask[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTasks(readFollowUpTasks());
  }, []);

  const persist = useCallback((next: AgentFollowUpTask[]) => {
    setTasks(next);
    writeFollowUpTasks(next);
  }, []);

  const addTask = useCallback(
    (input: CreateAgentFollowUpTaskInput) => {
      setError(null);
      startTransition(async () => {
        const result = await createAgentFollowUpTaskAction(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        const current = readFollowUpTasks();
        persist([result.task, ...current]);
      });
    },
    [persist],
  );

  const addLocalTask = useCallback(
    (input: CreateAgentFollowUpTaskInput) => {
      setError(null);
      try {
        const task = buildAgentFollowUpTask(input);
        const current = readFollowUpTasks();
        persist([task, ...current]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to add task.");
      }
    },
    [persist],
  );

  const toggleStatus = useCallback(
    (taskId: string) => {
      const current = readFollowUpTasks();
      persist(
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: task.status === "open" ? "done" : "open",
              }
            : task,
        ),
      );
    },
    [persist],
  );

  const removeTask = useCallback(
    (taskId: string) => {
      const current = readFollowUpTasks();
      persist(current.filter((task) => task.id !== taskId));
    },
    [persist],
  );

  const visible = workflowId
    ? tasks.filter((task) => task.workflowId === workflowId)
    : tasks;

  return {
    tasks: visible,
    allTasks: tasks,
    pending,
    error,
    addTask,
    addLocalTask,
    toggleStatus,
    removeTask,
  };
}

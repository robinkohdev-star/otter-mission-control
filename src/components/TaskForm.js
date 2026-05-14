import React, { useState } from 'react';
import { useStore } from '../store';

function TaskForm() {
  const [taskText, setTaskText] = useState('');
  const dispatch = useStore().dispatch;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskText.trim()) {
      dispatch({ type: 'ADD_TASK', payload: taskText });
      setTaskText('');
    }
  };

  return (
    <div className="TaskForm">
      <h2>Add Task</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="Enter task description"
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

export default TaskForm;
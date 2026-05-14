import React, { useState } from 'react';
import Task from './Task';

function TodoList() {
  const [tasks, setTasks] = useState([]);

  const addTask = (task) => {
    setTasks([...tasks, task]);
  };

  const deleteTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="TodoList">
      <h1>Todo List</h1>
      {tasks.map((task, index) => (
        <Task key={index} task={task} deleteTask={() => deleteTask(index)} />
      ))}
      <button onClick={() => addTask({ text: 'New Task' })}>Add Task</button>
    </div>
  );
}

export default TodoList;
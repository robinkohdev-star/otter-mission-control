export const ADD_TASK = 'ADD_TASK';
export const DELETE_TASK = 'DELETE_TASK';

export const addTask = (payload) => ({
  type: ADD_TASK,
  payload,
});

export const deleteTask = (payload) => ({
  type: DELETE_TASK,
  payload,
});
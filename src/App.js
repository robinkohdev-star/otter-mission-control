import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import TodoList from './components/TodoList';
import TaskForm from './components/TaskForm';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path="/" component={TodoList} />
          <Route path="/add" component={TaskForm} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
import React, { Component } from 'react'
import axios from 'axios';
import { resolve } from 'any-promise';

class App extends Component {
  state = {
    sessions: {}
  }

  async componentDidMount() {
    await this.fetchSessions();
  }

  fetchSessions = async () => {
    const { data: { text: result } } = await axios.get('/api/catfact');
    this.setState({ result })
  }

  render() {
    const { result } = this.state;

    return (
      <div className="App">
        {result}
      </div>
    )
  }
}

export default App
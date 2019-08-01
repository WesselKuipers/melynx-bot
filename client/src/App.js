import React, { Component } from 'react'
import axios from 'axios';

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
        <p>{result}</p>
        <a href="/api/discord/login">Login through discord</a>
      </div>
    )
  }
}

export default App
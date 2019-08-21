import React from 'react';
import { Context } from './provider';

export default class Consumer extends React.Component {
  render() {
    const { children } = this.props;

    return (
      <Context.Consumer>
        {({ user, setUser }) => {
          return React.Children.map(children, child =>
            React.cloneElement(child, {
              user,
              setUser,
            })
          );
        }}
      </Context.Consumer>
    );
  }
}

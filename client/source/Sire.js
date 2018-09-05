import React from 'react';

export default class Sire extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            test: 'hi from page Sire',

        };
    }
    render() {

        return (
            <div>{this.state.test} </div >)
    };
}

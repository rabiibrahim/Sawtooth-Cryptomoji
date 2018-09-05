import React from 'react';
import { callProcessorBatches } from './services/request';
import { encodeAll } from './services/transactions';

export default class Collections extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            test: '',

        };
    }
    callCollection() {
        const encodedPayload = encodeAll(this.props.privateKey, { action: 'CREATE_COLLECTION' });
        console.log(encodedPayload);
        callProcessorBatches(encodedPayload);
    }
    render() {
        return (
            <div> {this.callCollection()} </div >)
    };
}

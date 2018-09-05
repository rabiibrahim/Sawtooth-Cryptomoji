import axios from 'axios';
import { decode } from './encoding'
export const callProcessorBatches = (encodedPayload) => {

    axios({
        method: 'POST',
        url: '/api/batches',
        data: encodedPayload,
        headers: { 'Content-Type': 'application/octet-stream' }

    }).then(response => {
        console.log(decode(response.data).toString());
    });
};


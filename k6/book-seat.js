import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    iterations: 10,
};

export default function() {
    // Make a GET request to the target URL
    http.get('http://localhost:4001/api/v1/health');

    // Sleep for 1 second to simulate real-world usage
    sleep(1);
}

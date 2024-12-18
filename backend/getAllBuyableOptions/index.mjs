import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
    if (event.requestContext) {
        // Preflight request handling for CORS.
        if (event.requestContext.http.method === 'OPTIONS') {
            return createResponse(204, 'No Content', 'Preflight request.', {});
        } else if (event.requestContext.http.method !== 'GET') { // Require GET.
            return createResponse(405, 'Method Not Allowed', 'GET method is required.', {});
        }
    }


    // Query Dynamo for all items without a buyerId attribute
    try {
        const params = {
            TableName: process.env.TABLE_NAME,
            FilterExpression: "attribute_not_exists(buyerId)",
        };

        const { Items } = await dynamo.scan(params).promise();

        return createResponse(200, 'OK', 'Items fetched.', Items);

    } catch (error) {
        return createResponse(500, 'Failed to fetch items from Dynamo.', error);
    }
};


// Create response.
const createResponse = (statusCode, statusDescription, message, data) => {
    const response = {
        statusCode,
        statusDescription,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message,
            data
        })
    };

    statusCode === 200 ? console.log('RESPONSE:', response) : console.error('RESPONSE:', response);

    return response;
};
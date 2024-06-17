require('dotenv').config()

const PORT = process.env.PORT

const server = () => {
    console.log('You are listning to port:', PORT);
}

server()
# Steps to clone template

1. Create folder for your project and cd into it

2. Perform the following commands in the command line
```bash
git clone https://github.com/SEB-PT-9-Bahrain/auth-template-backend.git .
rm -rf .git
rm README.md
```

3. Create a .env file with the following values:
```
MONGODB_URI=your-connection-string
PORT=3000
CLIENT_URL=http://localhost:5173
JWT_SECRET=super-secret-key-no-one-would-guess
```


4. run:
```bash
npm i
```


5. run:
```bash
npm run dev
```

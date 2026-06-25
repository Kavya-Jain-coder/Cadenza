const email = "test2468@example.com";
const password = "testpassword123";
const url = "https://cadenza-sigma.vercel.app";

async function test() {
  // 1. Sign Up
  let res = await fetch(`${url}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username: "Test2468" })
  });
  console.log("Signup Status:", res.status);
  let data = await res.json();
  console.log("Signup Response:", data);

  // 2. Get CSRF
  res = await fetch(`${url}/api/auth/csrf`);
  data = await res.json();
  const csrfToken = data.csrfToken;
  const cookies = res.headers.get('set-cookie');

  // 3. Login
  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('redirect', 'false');
  formData.append('csrfToken', csrfToken);

  res = await fetch(`${url}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
    },
    body: formData.toString(),
    redirect: 'manual'
  });

  console.log("Login Status:", res.status);
  console.log("Login Location:", res.headers.get('location'));
  console.log("Login Cookie:", res.headers.get('set-cookie'));
}
test().catch(console.error);

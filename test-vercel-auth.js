const email = "test@example.com";
const password = "testpassword123";
const url = "https://cadenza-sigma.vercel.app";

async function test() {
  let res = await fetch(`${url}/api/auth/csrf`);
  let data = await res.json();
  const csrfToken = data.csrfToken;
  const cookies = res.headers.get('set-cookie');
  
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
  console.log("Location:", res.headers.get('location'));
  console.log("Set-Cookie:", res.headers.get('set-cookie'));
  const text = await res.text();
  console.log("Body:", text);
}
test().catch(console.error);

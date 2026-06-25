const rawCookies = "__Secure-authjs.callback-url=https%3A%2F%2Fcadenza-sigma.vercel.app; Path=/; HttpOnly; Secure; SameSite=Lax, __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiVjNJS2c1NlNSeko5QWp0NDl4OW9tSWFBRm5acUt3Tmx3OFZ5cTllV3lwV1ZQVnFDN3Z6S0pGME4tQ1RDQnNZRjVPMWdFY2ZET0tlc21LdG1DSDhTM0EifQ..8l6ItmbQcDC-UHPxz9zbPA.kLHIgdQeHTc6LLXma39Y-IMwj7Inr9odlJ_YI6Btgd0yHUVGNHJ2WNKaVkGqggWWTFcao2ak55bzIKn1zNA7Wxw-CsiWg529ygGofDxem1PbedqEueVwwB3FYMMEm5AXgOu6eFft3IwtzjzR2j9Z_gFDmYqvN9vY6tUyEIkObbg7Uo4HcnMj8Fhd2E_ZmseePrBQW2XKgrPYNq2ITqlp-Mc3j2RL73kPvyYQWa34OmQbE87jANUYkxGm8vfEvoJmt9cyiNF-QQilM71un_P52bFjGeAbiZMLDwzWRrTGv9nutuSn0K1DAfO-wp_OhxlhRv6RbVHGvdqIhOknM8qrMg.JKH5Lmzoonke0Kcpz_r1Zatzdk5KC2dKMWNMlR07mqI; Path=/; Expires=Sat, 25 Jul 2026 08:44:23 GMT; HttpOnly; Secure; SameSite=Lax";

// Extract just the session token
const match = rawCookies.match(/__Secure-authjs\.session-token=([^;]+)/);
const sessionCookie = match ? `__Secure-authjs.session-token=${match[1]}` : "";

console.log("Using cookie:", sessionCookie);

const url = "https://cadenza-sigma.vercel.app";

async function test() {
  const res = await fetch(`${url}/api/auth/session`, {
    headers: {
      'Cookie': sessionCookie,
      'User-Agent': 'Node-Fetch'
    }
  });
  console.log("Session Status:", res.status);
  const data = await res.json();
  console.log("Session Data:", data);
}
test().catch(console.error);

async function run() {
  const loginRes = await fetch('http://localhost:5002/api/auth/login', {
    method: 'POST', body: JSON.stringify({ email: 'madridistabiswash@gmail.com', password: 'password123' }),
    headers: { 'Content-Type': 'application/json' }
  });
  const loginData = await loginRes.json();
  const res = await fetch('http://localhost:5002/api/manager/visits?shop=a424a307-cf13-455b-816c-15a086907c1c', {
    headers: { 'Authorization': 'Bearer ' + loginData.token }
  });
  const data = await res.text();
  console.log(data.substring(0, 500));
}
run();

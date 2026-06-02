const PORT = 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function testCRUD() {
  console.log("Testing Resume API CRUD Operations...");

  // Generate random email to avoid collision
  const testEmail = `testuser_${Math.random().toString(36).substring(2, 10)}@example.com`;
  const testPassword = "password123";
  const testName = "Test User";

  // 1. Signup
  console.log("\\n1. Testing Signup...");
  let res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName: testName, email: testEmail, password: testPassword })
  });
  let signupData = await res.json();
  if (!res.ok) {
    console.error("Signup failed:", signupData);
    process.exit(1);
  }
  const token = signupData.token;
  console.log("Signup success! Token obtained.");

  // 2. Create Resume
  console.log("\\n2. Testing Create Resume...");
  res = await fetch(`${BASE_URL}/resumes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      name: "API Test Resume",
      template: "classic",
      themeColor: "#000000",
      personal: { fullName: "API Candidate" }
    })
  });
  let resume = await res.json();
  if (!res.ok) {
    console.error("Create failed:", resume);
    process.exit(1);
  }
  console.log(`Create success! New Resume ID: ${resume._id}, Name: ${resume.name}`);
  const resumeId = resume._id;

  // 3. Get Resumes
  console.log("\\n3. Testing Get Resumes...");
  res = await fetch(`${BASE_URL}/resumes`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  let resumesList = await res.json();
  if (!res.ok) {
    console.error("Get resumes failed:", resumesList);
    process.exit(1);
  }
  console.log(`Get success! Total Resumes found: ${resumesList.length}`);
  if (resumesList[0]._id !== resumeId) {
    console.error("ID mismatch in get list!");
    process.exit(1);
  }

  // 4. Duplicate Resume
  console.log("\\n4. Testing Duplicate Resume...");
  res = await fetch(`${BASE_URL}/resumes/${resumeId}/duplicate`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` }
  });
  let duplicated = await res.json();
  if (!res.ok) {
    console.error("Duplicate failed:", duplicated);
    process.exit(1);
  }
  console.log(`Duplicate success! Duplicated Resume ID: ${duplicated._id}, Name: ${duplicated.name}`);
  const dupId = duplicated._id;

  // Verify duplication count
  res = await fetch(`${BASE_URL}/resumes`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  resumesList = await res.json();
  console.log(`Post-duplicate check: Total Resumes found: ${resumesList.length}`);
  if (resumesList.length !== 2) {
    console.error("Expected 2 resumes, found:", resumesList.length);
    process.exit(1);
  }

  // 5. Delete Original Resume
  console.log("\\n5. Testing Delete Original Resume...");
  res = await fetch(`${BASE_URL}/resumes/${resumeId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  let deleteRes = await res.json();
  if (!res.ok) {
    console.error("Delete failed:", deleteRes);
    process.exit(1);
  }
  console.log("Delete success!", deleteRes);

  // Verify deletion
  res = await fetch(`${BASE_URL}/resumes`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  resumesList = await res.json();
  console.log(`Post-delete check: Total Resumes found: ${resumesList.length}`);
  if (resumesList.length !== 1 || resumesList[0]._id !== dupId) {
    console.error("Post-delete validation failed!");
    process.exit(1);
  }

  // Delete Duplicated Resume to clean up database
  console.log("\\nCleaning up duplicated resume...");
  await fetch(`${BASE_URL}/resumes/${dupId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  console.log("\\n🎉 ALL RESUME CRUD API TESTS PASSED SUCCESSFULLY! 🎉");
}

testCRUD().catch(err => {
  console.error("Unhandled test error:", err);
  process.exit(1);
});

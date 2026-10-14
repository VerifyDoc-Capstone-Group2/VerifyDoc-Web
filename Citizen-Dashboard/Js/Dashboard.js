const name1 = document.querySelectorAll(".user-name");
const initial = document.getElementById("initials");
const dayOfTheTime = document.querySelectorAll(".day");

const getDayStatus = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
};

//fetch user details
async function fetchUserData() {
  const API_BASE_URL = "https://verifydoc-api-v1.onrender.com";
  const token = localStorage.getItem("authorization");

  //get user details
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    name1.forEach((element) => {
      element.textContent = data.data.firstName;
    });
    const getFirstNameInitial = (firstName) =>
      firstName.trim().charAt(0).toUpperCase();
    initial.textContent = getFirstNameInitial(data.data.firstName);

    dayOfTheTime.forEach((element) => {
      element.textContent = getDayStatus();
    });
    console.log(data);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

fetchUserData();

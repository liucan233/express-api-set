if (localStorage.getItem("cas")) {
  location.href = "./enteredCas";
}

const captcha = document.querySelector(".captcha"),
  user = document.querySelector(".user"),
  passwd = document.querySelector(".passwd"),
  cookie = document.querySelector(".cookie");

function handleStartup() {
  fetch("./api/swust/loginCas")
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      captcha.src = res.data.captcha;
      cookie.value = res.data.cookie;
    });
}

handleStartup();

function handleSubmit(e) {
  e.preventDefault();
  const form = new FormData(e.target),
    params = new URLSearchParams([...form.entries()]);
  fetch("./api/swust/loginCas", {
    method: "post",
    body: params.toString(),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      if (res.code === 200) {
        alert(JSON.stringify(res));
        localStorage.setItem("cas", res.data.cookie);
        location.href = "./enteredCas";
      } else {
        throw new Error(res.msg);
      }
    })
    .catch((err) => {
      alert(err.message);
      handleStartup();
    });
}

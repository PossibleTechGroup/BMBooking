const otp = Math.floor(100000 + Math.random() * 900000);

fetch("https://api.afromessage.com/api/send", {
    method: "POST",
    headers: {
        Authorization:
            "Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoid3Y5Y3pidFF3U3I0N1hsZUpBdnhCbEVWOG42UDQ3aFIiLCJleHAiOjE5MTk0ODcwMDksImlhdCI6MTc2MTcyMDYwOSwianRpIjoiZWNlM2E1ODUtOTQ2Zi00YTliLThmOGEtNjUwOGJiY2I0YWQ5In0.1vfGuCyLMFDHOeN_1f1W432CrX-_DCNaYlh0oRr15gQ",
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        from: "e80ad9d8-adf3-463f-80f4-7c4b39f7f164",
        sender: "PosstechPLC",
        to: "+251986064500",
        message: `Your OTP code is ${otp}`,
    }),
})
    .then((res) => res.json())
    .then((data) => {
        console.log("OTP:", otp);
        console.log(data);
    })
    .catch((err) => {
        console.error(err);
    });
$(document).ready(function () {

	parseCookies();

	if (getCookie("auth", "") !== "") {
		InitialSettingsSave();
	}

	const authWait = setInterval(function () {

		parseCookies();

		if (getCookie("auth", "") !== "" && getCookie("authchange", "false") === "true") {
			setCookie({name: "authchange", newValue: "false"});

			InitialSettingsSave();
		}
		else if (getCookie("auth", "") === "") {
			$("#launch").prop("disabled", true);
			$("#link").html("<span style='color: red;'>App not yet authorized. Authorize the app to get a link.</span>");
		}
	}, 250);

	let appWindow = null;

	function InitialSettingsSave() {

		const host = document.location.href.split("//")[1].split("/")[0];
		const isDev = (host === "localhost:5000" || host === "local.bitbossbattles.io:5000");

		setCookie({name: "auth", newValue: getCookie("auth", ""), secure: !isDev});
		setCookie({name: "refrsl", newValue: getCookie("refrsl", ""), secure: !isDev});

		$.ajax({
			url: "https://api.twitch.tv/kraken/user",
			type: "GET",
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Accept', "application/vnd.twitchtv.v5+json");
				xhr.setRequestHeader('Authorization', "OAuth " + getCookie("auth", ""));
				xhr.setRequestHeader('Client-ID', twitchClientId);
			},
			success: function (data) {

				userId = data._id;
				setCookie({name: "userid", newValue: userId});
				const slToken = getCookie("refrsl", "");

				$("#launch").prop("disabled", false);
				$("#link").html("https://bbb.roolurker.xyz/app.html?userid=" + userId + "&token=" + getCookie("auth", "") + "&sl=" + slToken + "&rev=" + 5);

				const settings = {
					overwrite: false,
					sound: (getCookie("sound", "false") === "true"),
					trans: (getCookie("trans", "false") === "true"),
					chroma: (getCookie("chroma", "false") === "true"),
					persistence: (getCookie("persistent", "false") === "true"),
					bossHealing: (getCookie("bossheal", "false") === "true"),
					avtrHidden: (getCookie("hideavtr", "false") === "true"),
					hpMode: getCookie("hptype", "overkill"),
					hpInit: parseInt(getCookie("hpinit", "1000")),
					hpMult: parseInt(getCookie("hpmult", "1")),
					hpIncr: parseInt(getCookie("hpincr", "100")),
					hpAmnt: parseInt(getCookie("hpamnt", "1000")),
					colorBg: getCookie("colorbg", "rgba(34, 34, 34, 1)"),
					colorHb: getCookie("colorhb", "rgba(255, 0, 0, 1)"),
					colorHm: getCookie("colorhm", "rgba(255, 165, 0, 1)"),
					colorHf: getCookie("colorhf", "rgba(0, 128, 0, 1)"),
					colorTx: getCookie("colortx", "rgba(255, 255, 255, 1)")
				};

				$.post("/settings/" + userId, settings, function (res) {
					if (res === "success") {
					}
				});
			}
		});
	}

	function LaunchTwitchAuth() {
		window.open("https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=" + twitchClientId + "&redirect_uri=" + twitchRedirectUri + "&scope=user_read", "", "width=400,height=512");
	}

	function LaunchStreamlabsAuth() {
		window.open("https://streamlabs.com/api/v1.0/authorize?response_type=code&client_id=" + slClientId + "&redirect_uri=" + slRedirectUri + "&scope=donations.read", "", "width=720,height=1031");
	}

	function ClearStreamlabsAuth() {
		deleteCookie("authsl");
		deleteCookie("refrsl");
		setCookie({name: "authchange", newValue: "true"});
	}

	function LaunchApp() {

		appWindow = window.open("./app.html", "App", "width=350,height=100");
	}

	function LaunchDemo() {

		appWindow = window.open("./demo.html", "Demo", "width=350,height=325");
	}

	$("#authtwitch").click(LaunchTwitchAuth);
	$("#authsl").click(LaunchStreamlabsAuth);
	$("#clearsl").click(ClearStreamlabsAuth);
	$("#launch").click(LaunchApp);
	$("#demo").click(LaunchDemo);
});
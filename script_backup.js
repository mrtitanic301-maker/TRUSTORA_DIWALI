

// TRUSTORA - Complete Database Version
// ========================================

// 1. SUPABASE SETTINGS
const SUPABASE_URL = "https://ehnbhkhtbtzlefiutham.supabase.co";

// Apni asli Publishable Key yahan paste karo.
// Secret Key kabhi yahan mat daalna.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ytSwB_gZWTr8nyuByq7HNA_PAd9l6Ws";
// ========================================

// 2. PAGE ELEMENTS
const form = document.getElementById("surpriseForm");
const linkBox = document.getElementById("linkBox");
const shareLinkInput = document.getElementById("shareLink");

const validThemes = [
    "birthday",
    "anniversary",
    "diwali",
    "wedding",
    "friendship",
    "festival"
];


// 3. CONNECT SUPABASE
let supabaseClient = null;

if (
    window.supabase &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")
) {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    console.log("TRUSTORA: Supabase connected!");
} else {
    console.error(
        "TRUSTORA: Supabase credentials or library missing."
    );
}


// 4. CREATE SURPRISE
if (form) {
    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (!supabaseClient) {
            alert("Database connection nahi hai. Page refresh karo.");
            return;
        }

        const sender = document.getElementById("sender").value.trim();
        const receiver = document.getElementById("receiver").value.trim();
        const theme = document.getElementById("theme").value;
        const message = document.getElementById("message").value.trim();

        if (!sender || !receiver) {
            alert("Sender aur Receiver ka naam likho.");
            return;
        }

        if (
            sender.length > 80 ||
            receiver.length > 80 ||
            message.length > 2000
        ) {
            alert("Naam ya message bahut lamba hai.");
            return;
        }

        if (!validThemes.includes(theme)) {
            alert("Please valid occasion select karo.");
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            console.log("TRUSTORA: Saving surprise...");

            const { data, error } = await supabaseClient.rpc(
                "create_trustora_surprise",
                {
                    p_sender: sender,
                    p_receiver: receiver,
                    p_theme: theme,
                    p_message: message
                }
            );

            if (error) {
                throw error;
            }

            const publicId = data;

            if (
                typeof publicId !== "string" ||
                !/^[0-9a-f-]{36}$/i.test(publicId)
            ) {
                throw new Error("Invalid surprise ID received.");
            }

            const url = new URL(window.location.href);

            url.search = "";
            url.hash = "";

            url.searchParams.set("surprise", publicId);

            shareLinkInput.value = url.href;
            linkBox.hidden = false;

            linkBox.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            console.log("TRUSTORA: Surprise saved!", publicId);
            alert("TRUSTORA surprise successfully saved! 🎉");

        } catch (error) {
            console.error("TRUSTORA save error:", error);
            alert(
                "Surprise save nahi hua. Console mein error check karo."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}


// 5. COPY SURPRISE LINK
const copyButton = document.getElementById("copyButton");

if (copyButton) {
    copyButton.addEventListener("click", async function() {
        try {
            await navigator.clipboard.writeText(
                shareLinkInput.value
            );

            alert("TRUSTORA link copied successfully! 🎉");

        } catch (error) {
            shareLinkInput.select();
            alert("Link select ho gaya hai. Ab Ctrl + C dabao.");
        }
    });
}


// 6. SHARE ON WHATSAPP
const shareButton = document.getElementById("shareButton");

if (shareButton) {
    shareButton.addEventListener("click", function() {
        const message =
            "I created a special surprise for you! ✨ Open it here: " +
            shareLinkInput.value;

        const whatsappURL =
            "https://wa.me/?text=" + encodeURIComponent(message);

        window.open(whatsappURL, "_blank");
    });
}


// 7. OCCASION TITLE
function getOccasionTitle(theme) {
    const titles = {
        birthday: "🎂 Happy Birthday!",
        anniversary: "💍 Happy Anniversary!",
        diwali: "🪔 Happy Diwali!",
        wedding: "💒 Best Wishes!",
        friendship: "💌 Happy Friendship!",
        festival: "✨ Happy Celebrations!"
    };

    return titles[theme] || "A Special Surprise!";
}


// 8. DISPLAY SURPRISE
function openSurprise(data) {
    const main = document.querySelector("main");
    const navbar = document.querySelector(".navbar");

    if (main) main.hidden = true;
    if (navbar) navbar.hidden = true;

    const screen = document.createElement("section");

    screen.style.cssText = `
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:25px;
        text-align:center;
        background:radial-gradient(circle at center,#382718,#09090d 70%);
    `;

    const card = document.createElement("div");

    card.style.cssText = `
        max-width:650px;
        width:100%;
        padding:45px 25px;
        border:1px solid rgba(217,181,109,.5);
        border-radius:20px;
        background:rgba(19,19,27,.9);
        box-shadow:0 20px 70px rgba(0,0,0,.4);
    `;

    const icon = document.createElement("div");
    icon.textContent = "🎁";
    icon.style.fontSize = "75px";

    const label = document.createElement("p");
    label.textContent = "A SPECIAL SURPRISE FOR";
    label.style.cssText =
        "color:#d9b56d;letter-spacing:3px;margin:20px 0;";

    const name = document.createElement("h1");
    name.textContent = data.receiver;
    name.style.cssText = `
        font-family:'Playfair Display',serif;
        font-size:clamp(38px,8vw,70px);
        color:#f6dda3;
        overflow-wrap:anywhere;
    `;

    const heading = document.createElement("h2");
    heading.textContent = getOccasionTitle(data.theme);
    heading.style.cssText =
        "margin:20px 0;color:#fff;font-size:25px;";

    const message = document.createElement("p");
    message.textContent = data.message ||
        "Wishing you happiness, beautiful memories and endless smiles!";
    message.style.cssText =
        "color:#c7c1c9;margin:20px auto;max-width:500px;";

    const sender = document.createElement("p");
    sender.textContent = "With love, " + data.sender;
    sender.style.cssText =
        "color:#d9b56d;margin-top:25px;";

    const button = document.createElement("button");
    button.textContent = "CREATE YOUR OWN SURPRISE ✨";
    button.className = "primary-button";
    button.style.marginTop = "30px";

    button.addEventListener("click", function() {
        window.location.href = window.location.pathname;
    });

    card.append(
        icon,
        label,
        name,
        heading,
        message,
        sender,
        button
    );

    screen.appendChild(card);
    document.body.appendChild(screen);
}


// 9. LOAD SURPRISE FROM DATABASE
async function loadSurprise(publicId) {
    if (!supabaseClient) {
        alert("Database connection unavailable.");
        return;
    }

    if (!/^[0-9a-f-]{36}$/i.test(publicId)) {
        alert("Invalid surprise link.");
        return;
    }

    try {
        console.log("TRUSTORA: Loading surprise...");

        const { data, error } = await supabaseClient.rpc(
            "get_trustora_surprise",
            {
                p_public_id: publicId
            }
        );

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            alert("Surprise nahi mila. Link check karo.");
            return;
        }

        const surprise = data[0];

        if (
            typeof surprise.sender !== "string" ||
            typeof surprise.receiver !== "string" ||
            !validThemes.includes(surprise.theme)
        ) {
            throw new Error("Invalid surprise data.");
        }

        openSurprise({
            sender: surprise.sender,
            receiver: surprise.receiver,
            theme: surprise.theme,
            message: surprise.message || ""
        });

        console.log("TRUSTORA: Surprise loaded!");

    } catch (error) {
        console.error("TRUSTORA loading error:", error);
        alert("Surprise load nahi hua. Please try again.");
    }
}


// 10. CHECK URL
const params = new URLSearchParams(window.location.search);
const surpriseId = params.get("surprise");

if (surpriseId) {
    loadSurprise(surpriseId);
}



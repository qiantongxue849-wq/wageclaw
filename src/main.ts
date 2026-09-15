import { createApp } from "vue";
import { migrateLegacyUserStorage, setActiveUserId } from "@/services/user-storage";
import { STORAGE_KEY } from "@/state/persistence";

async function bootstrap() {
  const viewMode = new URLSearchParams(window.location.search).get("view");
  const session = window.wageclawDesktop
    ? await window.wageclawDesktop.authGetSession()
    : { configured: false, authenticated: false, user: null };

  if (!session.authenticated || !session.user) {
    setActiveUserId("");
    const [{ default: AuthApp }] = await Promise.all([
      import("./AuthApp.vue"),
      import("./auth.css")
    ]);
    createApp(AuthApp).mount("#app");
    return;
  }

  setActiveUserId(session.user.id);
  migrateLegacyUserStorage(STORAGE_KEY, session.user.id);

  if (viewMode === "float") {
    const [{ default: PetApp }] = await Promise.all([
      import("./PetApp.vue"),
      import("./pet.css")
    ]);
    createApp(PetApp).mount("#app");
    return;
  }

  const [{ default: App }] = await Promise.all([
    import("./App.vue"),
    import("./styles.css").then(() => import("./styles/motion.css"))
  ]);
  createApp(App).mount("#app");
}

void bootstrap();

import { createApp } from "vue";

async function bootstrap() {
  const viewMode = new URLSearchParams(window.location.search).get("view");

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
    import("./styles.css")
  ]);
  createApp(App).mount("#app");
}

void bootstrap();

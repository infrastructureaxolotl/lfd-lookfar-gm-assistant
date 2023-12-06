export const dataLoader = {
  threatsData: {},
  fluffData: {},
  discoveryData: {},
  battleEffectsData: {},

  async loadData() {
    try {
      // Fetch and load data for threats
      const threatsResponse = await fetch(
        "/modules/lfd-lookfar-gm-assistant/data/data.json"
      );
      this.threatsData = await threatsResponse.json();
      console.log("Threats Data:", this.threatsData);

      // Fetch and load data for fluff
      const fluffResponse = await fetch(
        "/modules/lfd-lookfar-gm-assistant/data/fluff.json"
      );
      this.fluffData = await fluffResponse.json();
      console.log("Fluff Data:", this.fluffData);

      // Fetch and load data for discoveries
      const discoveryResponse = await fetch(
        "/modules/lfd-lookfar-gm-assistant/data/discoveries.json"
      );
      this.discoveryData = await discoveryResponse.json();
      console.log("Discovery Data:", this.discoveryData);

      // Fetch and load data for battle effects
      const battleEffectsResponse = await fetch(
        "/modules/lfd-lookfar-gm-assistant/data/battleEffects.json"
      );
      this.battleEffectsData = await battleEffectsResponse.json();
      console.log("Battle Effects Data:", this.battleEffectsData);

      console.log("Data loaded successfully.");
    } catch (error) {
      console.error("Error loading data:", error);
    }
  },
};

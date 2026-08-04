export function PlayEditMixin(Base) {
  return class extends Base {
    _mode = "play";
    _modeInitialized = false;

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        if (!this._modeInitialized) {
            const isNew = this.document._stats.createdTime === this.document._stats.modifiedTime;
            this._mode = isNew ? "edit" : "play";
            this._modeInitialized = true;
        }

        context.canEdit = game.user.isGM;
        context.editable = context.canEdit && this._mode === "edit";
        return context;
    }

    static async _onToggleMode(event, target) {
        if (!game.user.isGM) return;
        this._mode = this._mode === "edit" ? "play" : "edit";
        this.render();
    }

    *_headerControlButtons() {
      for (const control of super._headerControlButtons()) yield control;

      if (game.user.isGM) {
        yield {
          icon: `fas ${this._mode === "edit" ? "fa-lock-open" : "fa-lock"}`,
          label: this._mode === "edit" ? "Lock (Play Mode)" : "Unlock (Edit Mode)",
          action: "toggleMode"
        };
      }
    }
  };
}
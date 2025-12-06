from app.models.ui_config import ui_config_collection

async def get_ui_config():
    config = await ui_config_collection.find_one({})
    if not config:
        config = {"banners": [], "announcements": [], "theme": "light"}
        await ui_config_collection.insert_one(config)
    config["id"] = str(config["_id"])
    del config["_id"]
    return config

async def update_ui_config(data):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    await ui_config_collection.update_one({}, {"$set": update_data}, upsert=True)
    return update_data

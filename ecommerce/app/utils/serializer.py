from bson import ObjectId

# Serialize single product
def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]

    # Convert ObjectIds
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)

    # Normalize category
    category = doc.get("category")
    if isinstance(category, str):
        doc["category"] = category.strip().lower()

    # Primary image
    if not doc.get("image"):
        images = doc.get("images")
        if isinstance(images, list) and len(images) > 0:
            doc["image"] = images[0]
        else:
            doc["image"] = "/img/default.jpg"

    return doc


# Serialize list of documents
def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

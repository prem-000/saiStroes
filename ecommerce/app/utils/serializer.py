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
    if doc.get("category"):
        doc["category"] = doc["category"].strip().lower()

    # Primary image
    if not doc.get("image"):
        if doc.get("images") and len(doc["images"]) > 0:
            doc["image"] = doc["images"][0]
        else:
            doc["image"] = "/img/default.jpg"

    return doc


# Serialize list of documents
def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

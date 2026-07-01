import heapq
from datetime import datetime

# Priority: Placement > Result > Event
priority = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
}

# Sample notifications
notifications = [
    {
        "id": "1",
        "type": "Placement",
        "message": "Microsoft Hiring",
        "timestamp": "2026-04-22 17:49:42",
        "isRead": False
    },
    {
        "id": "2",
        "type": "Result",
        "message": "Mid Semester Results",
        "timestamp": "2026-04-21 10:20:00",
        "isRead": False
    },
    {
        "id": "3",
        "type": "Event",
        "message": "Tech Fest",
        "timestamp": "2026-04-23 09:30:00",
        "isRead": False
    },
    {
        "id": "4",
        "type": "Placement",
        "message": "Amazon Hiring",
        "timestamp": "2026-04-23 15:00:00",
        "isRead": True
    },
    {
        "id": "5",
        "type": "Placement",
        "message": "Google Hiring",
        "timestamp": "2026-04-24 08:15:00",
        "isRead": False
    }
]

heap = []

for notification in notifications:

    # Ignore read notifications
    if notification["isRead"]:
        continue

    ts = datetime.strptime(
        notification["timestamp"],
        "%Y-%m-%d %H:%M:%S"
    ).timestamp()

    score = (
        priority[notification["type"]],
        ts
    )

    heapq.heappush(heap, (score, notification))

top_notifications = heapq.nlargest(10, heap)

print("Top Priority Notifications\n")

for _, notification in top_notifications:
    print("-----------------------------")
    print("ID       :", notification["id"])
    print("Type     :", notification["type"])
    print("Message  :", notification["message"])
    print("Time     :", notification["timestamp"])
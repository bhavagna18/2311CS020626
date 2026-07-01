# Stage 1

## Notification System REST API Design

### Base URL

```text
http://localhost:3000/api
```

## 1. Get Notifications

**Endpoint**

```text
GET /api/notifications
```

**Headers**

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body**

None

**Response (200 OK)**

```json
{
  "notifications": [
    {
      "id": "101",
      "title": "Placement Drive",
      "message": "Microsoft is hiring Software Engineers.",
      "type": "Placement",
      "isRead": false,
      "createdAt": "2026-04-22T10:30:00Z"
    }
  ]
}
```

## 2. Mark Notification as Read

**Endpoint**

```text
PUT /api/notifications/{id}/read
```

**Headers**

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body**

None

**Response (200 OK)**

```json
{
  "message": "Notification marked as read",
  "success": true
}
```


## 3. Create Notification

**Endpoint**

```text
POST /api/notifications
```

**Headers**

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body**

```json
{
  "title": "Placement Drive",
  "message": "Amazon is hiring for SDE roles.",
  "type": "Placement"
}
```

**Response (201 Created)**

```json
{
  "id": "102",
  "title": "Placement Drive",
  "message": "Amazon is hiring for SDE roles.",
  "type": "Placement",
  "isRead": false,
  "createdAt": "2026-04-22T11:00:00Z"
}
```

## 4. Delete Notification

**Endpoint**

```text
DELETE /api/notifications/{id}
```

**Headers**

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body**

None

**Response (200 OK)**

```json
{
  "message": "Notification deleted successfully",
  "success": true
}
```
## 5. Real-Time Notification Mechanism

### Technology

- WebSocket (Socket.IO)

### How it Works

1. The student logs into the application.
2. The frontend establishes a WebSocket connection with the server.
3. When an administrator creates a new notification, the server instantly pushes it to all connected students.
4. Connected students receive the notification immediately without refreshing the page.
5. If a student is offline, the notification is saved in the database and delivered when the student logs in again.

### Advantages

- Real-time notification delivery
- No page refresh required
- Better user experience
- Reduces unnecessary API polling
- Scalable for a large number of connected users

# Stage 2

## Database Schema and Query Optimization

### Database

- MySQL

### Database Schema

We need three tables: `users`, `notifications`, and `user_notifications`.

- **users**: Stores user information (e.g., student, admin).
- **notifications**: Stores notification content.
- **user_notifications**: A mapping table to track which user has received which notification and whether it has been read.

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('student', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Placement', 'Result', 'Event', 'General') NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    notification_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (notification_id) REFERENCES notifications(id)
);
```

### SQL Queries

**1. Get Unread Notifications for a User**

```sql
SELECT n.id, n.title, n.message, n.type, n.created_at
FROM notifications n
JOIN user_notifications un ON n.id = un.notification_id
WHERE un.user_id = ? AND un.is_read = FALSE
ORDER BY n.created_at DESC;
```

**2. Mark a Notification as Read**

```sql
UPDATE user_notifications
SET is_read = TRUE
WHERE user_id = ? AND notification_id = ?;
```

**3. Create a Notification for All Users**

```sql
-- Step 1: Insert the notification
INSERT INTO notifications (title, message, type, created_by)
VALUES (?, ?, ?, ?);

-- Step 2: Get the new notification_id
SET @notification_id = LAST_INSERT_ID();

-- Step 3: Link the notification to all users
INSERT INTO user_notifications (user_id, notification_id)
SELECT id, @notification_id FROM users WHERE role = 'student';
```

### Indexing and Query Optimization

- **Indexing**: To speed up query performance, we should add indexes to foreign keys and frequently queried columns.
  - `user_notifications(user_id, is_read)`: Speeds up fetching notifications for a specific user.
  - `user_notifications(notification_id)`: Improves performance when dealing with notification-specific operations.
  - `notifications(created_at)`: Optimizes sorting by creation date.

```sql
-- Add indexes
CREATE INDEX idx_user_notifications_user_id_is_read ON user_notifications(user_id, is_read);
CREATE INDEX idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

- **Query Optimization**:
  - Use `JOIN`s effectively to combine data from multiple tables.
  - Use `EXPLAIN` to analyze query execution plans and identify bottlenecks.
  - Avoid `SELECT *` and only select the columns you need.

### Conclusion

A well-designed schema with appropriate indexing is crucial for a scalable notification system. By optimizing our queries, we can ensure fast and efficient data retrieval, even as the number of users and notifications grows.

# Stage 3

## Scaling the Notification System

### Scaling Problems and Solutions

**1. High Load on Database**

- **Problem**: As the number of users and notifications increases, the database can become a bottleneck. Frequent polling for new notifications adds to the load.
- **Solution**:
  - **Read Replicas**: Use read replicas to distribute read queries. The primary database handles writes, while replicas handle reads.
  - **Caching**: Use an in-memory cache like Redis to store frequently accessed data, such as recent notifications.

**2. Real-Time Updates**

- **Problem**: Traditional polling is inefficient and doesn't provide true real-time updates.
- **Solution**:
  - **WebSockets**: Use WebSockets (e.g., with Socket.IO) for persistent, bidirectional communication between the client and server. This allows the server to push notifications to clients instantly.

### Caching

- **Strategy**: Cache recent notifications in Redis. When a user requests notifications, first check the cache. If the data is not in the cache, fetch it from the database and store it in the cache for future requests.
- **Cache Invalidation**: When a new notification is created or an existing one is updated, invalidate the relevant cache entries to ensure data consistency.

### Pagination

- **Problem**: Returning all notifications for a user at once can be slow and consume a lot of memory.
- **Solution**: Implement pagination to return a limited number of notifications per request.

```sql
-- Paginated query
SELECT n.id, n.title, n.message, n.type, n.created_at
FROM notifications n
JOIN user_notifications un ON n.id = un.notification_id
WHERE un.user_id = ? AND un.is_read = FALSE
ORDER BY n.created_at DESC
LIMIT ? OFFSET ?;
```

### Polling vs. WebSockets

- **Polling**: The client repeatedly asks the server for new data.
  - **Pros**: Simple to implement.
  - **Cons**: Inefficient, high latency, not real-time.
- **WebSockets**: The client establishes a persistent connection with the server.
  - **Pros**: Real-time, low latency, efficient.
  - **Cons**: More complex to implement and manage.

For a notification system, **WebSockets** are the superior choice for providing a real-time user experience.

### Conclusion

Scaling a notification system requires a multi-faceted approach. By using read replicas, caching, pagination, and WebSockets, we can build a system that is both scalable and provides a great user experience.

# Stage 4

## Performance Improvements

### Problem with "Notify All"

The current "Notify All" implementation is synchronous and can be slow and unreliable, especially with a large number of users. If the server crashes mid-process, some users may not receive the notification.

### Solution: Asynchronous Processing with a Message Queue

We can use a message queue like **RabbitMQ** or **Kafka** to process "Notify All" requests asynchronously.

**Architecture**

1.  **API Server**: When an admin sends a "Notify All" request, the API server publishes a message to a message queue (e.g., a RabbitMQ exchange).
2.  **Message Queue (RabbitMQ)**: The message queue acts as a buffer, holding the notification message.
3.  **Background Workers**: A pool of background workers subscribes to the queue. Each worker processes a message from the queue, fetches a batch of users, and sends them the notification.

**Diagram**

```
Admin --(HTTP POST)--> API Server --(Publish)--> RabbitMQ --(Consume)--> Background Workers --> User Devices
```

### Retry Mechanism

- If a notification fails to send (e.g., due to a temporary network issue), the worker can requeue the message with a delay. This ensures that the notification will be retried later.
- Using a Dead Letter Queue (DLQ) in RabbitMQ, we can handle messages that consistently fail, allowing for manual inspection and intervention.

### Asynchronous Processing

- The API server can respond to the admin immediately after publishing the message to the queue, without waiting for all notifications to be sent. This improves the user experience for the admin.
- Background workers can process notifications in parallel, significantly speeding up the "Notify All" feature.

### Conclusion

Using a message queue like RabbitMQ for the "Notify All" feature makes the system more resilient, scalable, and efficient. Asynchronous processing with background workers and a retry mechanism ensures reliable notification delivery to all users.

# Stage 5

## Reliable "Notify All" Design

### Algorithm

To display the top 10 priority notifications, we can use a **Priority Queue**, which is efficiently implemented using a **Min-Heap**.

**Priority Score Calculation**

We can define a priority score based on:
1.  **Notification Type**: `Placement > Result > Event`
2.  **Recency**: Newer notifications are more important.

```
Priority Score = (Priority_Type, Timestamp)
```

- `Priority_Type`: An integer representing the notification type (e.g., Placement=3, Result=2, Event=1).
- `Timestamp`: The creation time of the notification.

**Implementation**

1.  Fetch all unread notifications for the user from the database.
2.  For each notification, calculate its priority score.
3.  Push the notification and its score onto a Min-Heap of size 10.
    - If the heap is not full, add the new notification.
    - If the heap is full, compare the new notification's score with the smallest score in the heap (the root). If the new score is higher, remove the root and add the new notification.
4.  The notifications remaining in the heap are the top 10 priority notifications.

### Python Example (using `heapq`)

```python
import heapq

def get_top_10_notifications(notifications):
    heap = []
    priority = {"Placement": 3, "Result": 2, "Event": 1}

    for notification in notifications:
        if not notification['isRead']:
            score = (priority.get(notification['type'], 0), notification['timestamp'])
            
            if len(heap) < 10:
                heapq.heappush(heap, (score, notification))
            else:
                heapq.heappushpop(heap, (score, notification))

    # The heap now contains the top 10 notifications
    top_10 = sorted([item[1] for item in heap], key=lambda x: (priority.get(x['type'], 0), x['timestamp']), reverse=True)
    return top_10
```

### Conclusion

Using a Priority Queue (Min-Heap) is an efficient way to find the top K items from a list. This algorithm allows us to display the most important and relevant notifications to the user, enhancing their experience.

# Stage 6

## Priority Notifications Implementation

### Logic Explanation

The provided Python script `stage6_priority_notifications.py` demonstrates the logic for identifying top priority notifications. Here's a breakdown of how it works:

1.  **Priority Mapping**: A dictionary `priority` maps notification types (`Placement`, `Result`, `Event`) to numerical values. Higher values indicate higher priority.

    ```python
    priority = {
        "Placement": 3,
        "Result": 2,
        "Event": 1
    }
    ```

2.  **Data Source**: A list of sample `notifications` is used. Each notification is a dictionary containing its `id`, `type`, `message`, `timestamp`, and `isRead` status.

3.  **Filtering**: The script iterates through the notifications and ignores any that have been marked as `isRead`. This ensures that only unread notifications are considered for prioritization.

4.  **Scoring**: For each unread notification, a `score` is calculated. The score is a tuple consisting of the notification's priority and its timestamp. This two-level scoring ensures that:
    - Notifications are first sorted by their type priority.
    - For notifications of the same type, the one with the more recent timestamp is given higher priority.

5.  **Heap Data Structure**: A min-heap is used to efficiently keep track of the top notifications. The `heapq.heappush` function adds each notification's score and data to the heap.

6.  **Extracting Top Notifications**: `heapq.nlargest(10, heap)` is used to extract the 10 notifications with the highest scores from the heap.

7.  **Displaying Results**: The script then iterates through the `top_notifications` and prints their details in a user-friendly format.

### Key Concepts Demonstrated

-   **Priority Queue**: The use of a heap demonstrates a classic priority queue implementation, which is ideal for managing items with different levels of importance.
-   **Composite Sorting**: The scoring mechanism (`(priority, timestamp)`) is an excellent example of composite sorting, where items are sorted based on multiple criteria.
-   **Filtering**: The script effectively filters out irrelevant data (`isRead` notifications) before processing.

### Conclusion

The `stage6_priority_notifications.py` script provides a clear and effective implementation of a priority notification system. By combining priority levels with timestamps and using a heap for efficient sorting, the system can accurately identify and display the most important notifications to the user. This logic can be directly integrated into the backend service to power the "Top 10 Priority Notifications" feature.
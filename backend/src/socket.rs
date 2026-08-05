use socketioxide::extract::{SocketRef, Data};
use serde::Deserialize;
use crate::models::RoomCounter;

#[derive(Deserialize)]
struct JoinRoom {
    pin: String,
}

#[derive(Deserialize)]
struct EndSession {
    pin: String,
}

pub fn configure(io: &socketioxide::SocketIo, counter: RoomCounter) {
    io.ns("/", move |socket: SocketRef| async move {
        let c1 = counter.clone();
        let c2 = counter.clone();
        let c3 = counter.clone();

        socket.on("watch-session", move |socket: SocketRef, Data(data): Data<JoinRoom>| async move {
            let room = data.pin.clone();
            let _ = socket.leave_all();
            let _ = socket.join(room.clone());
        });

        socket.on("join-session", move |socket: SocketRef, Data(data): Data<JoinRoom>| {
            let c = c1.clone();
            async move {
                let room = data.pin.clone();
                let _ = socket.leave_all();
                let _ = socket.join(room.clone());

                {
                    let mut guard = c.lock().unwrap();
                    let entry = guard.entry(room.clone()).or_insert(0);
                    *entry += 1;
                }

                let count = c.lock().unwrap().get(&room).copied().unwrap_or(0);
                let _ = socket.within(room).emit("student-count", &count);
            }
        });

        socket.on("end-session", move |socket: SocketRef, Data(data): Data<EndSession>| {
            let c = c2.clone();
            async move {
                let room = data.pin.clone();
                let _ = socket.within(room.clone()).emit("session-ended", &serde_json::json!({}));
                {
                    c.lock().unwrap().remove(&room);
                }
                let _ = socket.within(room).disconnect();
            }
        });

        socket.on_disconnect(move |socket: SocketRef| {
            let c = c3.clone();
            async move {
                for room in socket.rooms() {
                    if room != socket.id.to_string() {
                        let mut guard = c.lock().unwrap();
                        if let Some(entry) = guard.get_mut(room.as_ref()) {
                            *entry = entry.saturating_sub(1);
                        }
                        let count = guard.get(room.as_ref()).copied().unwrap_or(0);
                        drop(guard);
                        let _ = socket.within(room).emit("student-count", &count);
                    }
                }
            }
        });
    });
}

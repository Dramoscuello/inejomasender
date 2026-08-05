use socketioxide::extract::{SocketRef, Data};
use serde::Deserialize;

#[derive(Deserialize)]
struct JoinRoom {
    pin: String,
}

#[derive(Deserialize)]
struct EndSession {
    pin: String,
}

pub fn configure(io: &socketioxide::SocketIo) {
    io.ns("/", |socket: SocketRef| async move {
        socket.on("join-session", |socket: SocketRef, Data(data): Data<JoinRoom>| async move {
            let room = data.pin.clone();
            let _ = socket.leave_all();
            let _ = socket.join(room.clone());

            let count = socket.within(room.clone()).sockets().len();

            let _ = socket.within(room).emit("student-count", &count);
        });

        socket.on("end-session", |socket: SocketRef, Data(data): Data<EndSession>| async move {
            let room = data.pin.clone();
            let _ = socket.within(room.clone()).emit("session-ended", &serde_json::json!({}));
            let _ = socket.within(room).disconnect();
        });

        socket.on_disconnect(|socket: SocketRef| async move {
            for room in socket.rooms() {
                if room != socket.id.to_string() {
                    let count = socket.within(room.clone()).sockets().len();
                    let _ = socket.within(room).emit("student-count", &count);
                }
            }
        });
    });
}

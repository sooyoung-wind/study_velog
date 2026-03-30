.PHONY: run server client install

run:
	@echo "Starting server (port 4000) and client (port 5173)..."
	@trap 'kill 0' INT; \
	(cd server && npm run dev) & \
	(cd client && npm run dev) & \
	wait

server:
	cd server && npm run dev

client:
	cd client && npm run dev

install:
	cd server && npm install
	cd client && npm install

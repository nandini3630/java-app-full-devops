"use client"

import { useEffect, useState, useRef } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws-auction'

export function useAuctionSocket(auctionId: number | string) {
  const [lastBid, setLastBid] = useState<any>(null)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!auctionId) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WEBSOCKET_URL),
      debug: (str) => console.log('STOMP: ' + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("Connected to WebSocket for auction", auctionId)
        client.subscribe(`/topic/auctions/${auctionId}`, (message) => {
          if (message.body) {
            const bidData = JSON.parse(message.body)
            setLastBid(bidData)
          }
        })
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"])
        console.error("Additional details: " + frame.body)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate()
      }
    }
  }, [auctionId])

  return lastBid
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Loader2, Moon, Signature, Sun } from "lucide-react"
import { useTheme as useNextTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"


import {ethers} from "ethers";
import axios from "axios";


async function getNonce(address: String, role: String): Promise<string> {

  try{
    const response = await axios.get(`http://localhost:3000/api/auth?address=${address}&role=${role}`);

    return response.data;
  }
  catch(error){
    console.log(error);
    return "";
  }

}

async function verifySignature(signature: string, address: String, role: String){
  try{
    const response = await axios.post('http://localhost:3000/api/auth/', {
      signature: signature,
      walletId: address,
      role: role
    });

    return response.data;
  }
  catch(error){
    console.log(error);
  }
}

export default function RegisterPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [role, setRole] = useState<"consumer" | "provider">("consumer")
  const [name, setName] = useState<string | null>(null);
  const router = useRouter()
  const { theme, setTheme } = useNextTheme()

  const handleConnect = async () => {
    setIsConnecting(true)

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask to use this application")
        setIsConnecting(false)
        return
      }

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" })

      //Connect to wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      console.log("Account: " + account);
      //Get nonce
      const data = await getNonce(account, role);
      console.log("Nonce: " + JSON.stringify(data));
      //Sign the message
      if(data.nonce){
        const signature: string = await signer.signMessage(data.nonce);
        console.log("Signature: " + signature);
        const response = await verifySignature(signature, account, role);
        console.log(response)
        if(response.isVerified){
          const registerResponse = await axios.post("http://localhost:3000/api/auth/register",{
            name: name,
            walletId: account,
            role: role
          })
          console.log(registerResponse.data);
          alert(registerResponse.data.msg);
        }
      }
      else alert("Nonce not generated");
    } 
    catch (error) {
      console.error("Error connecting to MetaMask:", error)
    }
    finally{
      setIsConnecting(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <Link href="/" className="absolute top-4 left-4 flex items-center text-sm font-medium">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/placeholder.svg?height=60&width=60" alt="Logo" width={60} height={60} />
            </div>
            <CardTitle className="text-2xl">Register to GasChain KYC</CardTitle>
            <CardDescription>Sign up with your MetaMask wallet to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="consumer"
              className="w-full"
              onValueChange={(value) => setRole(value as "consumer" | "provider")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="consumer">Consumer</TabsTrigger>
                <TabsTrigger value="provider">Gas Provider</TabsTrigger>
              </TabsList>
              <TabsContent value="consumer">
                <div className="text-center mb-4">
                  <Input className="mb-2" required onChange={(e) => setName(e.target.value)}  placeholder="Enter Full Name as per Aadhar" />
                  <p className="text-sm text-muted-foreground">
                    Connect as a gas consumer to upload documents and track your verification status
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="provider">
                <div className="text-center mb-4">
                  <Input className="mb-2" required onChange={(e) => setName(e.target.value)} placeholder="Enter Company Name" />
                  <p className="text-sm text-muted-foreground">
                  Connect as an gas provider to verify consumer documents and manage the platform
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              className="w-full relative group overflow-hidden"
              size="lg"
              onClick={handleConnect}
              disabled={(isConnecting || !name ? true : false) && (role == "provider" || role == "consumer")}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>Connect with MetaMask</>
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center w-full text-sm text-muted-foreground">
              <p>
                By connecting, you agree to our{" "}
                <Link href="#" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

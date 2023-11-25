import { Router } from "express";
import { createProxyMiddleware } from 'http-proxy-middleware'

export const casRouter:Router=Router();

casRouter.use('/cas', createProxyMiddleware({
    router: (req)=>{
        return ''
    }
}))
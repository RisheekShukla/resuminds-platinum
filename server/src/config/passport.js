import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as GitHubStrategy } from 'passport-github2'
import User from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id })
        
        if (!user) {
            // Check if user exists with same email
            const email = profile.emails?.[0]?.value
            if (email) {
                user = await User.findOne({ email })
                if (user) {
                    user.googleId = profile.id
                    await user.save()
                }
            }
        }

        if (!user) {
            user = await User.create({
                googleId: profile.id,
                name: profile.displayName || 'Google User',
                email: profile.emails?.[0]?.value,
            })
        }
        
        return done(null, user)
    } catch (err) {
        return done(err, null)
    }
}))

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ githubId: profile.id })
        
        if (!user) {
            const email = profile.emails?.[0]?.value || (profile.username + '@github.com')
            user = await User.findOne({ email })
            if (user) {
                user.githubId = profile.id
                await user.save()
            }
        }

        if (!user) {
            user = await User.create({
                githubId: profile.id,
                name: profile.displayName || profile.username || 'GitHub User',
                email: profile.emails?.[0]?.value || (profile.username + '@github.com'),
            })
        }
        
        return done(null, user)
    } catch (err) {
        return done(err, null)
    }
}))

export default passport

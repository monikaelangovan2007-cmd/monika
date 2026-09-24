require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

const registrationSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  age: { type: String, required: true },
  rollNo: { type: String, required: true },
  dob: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  course: { type: String, required: true },
  gender: { type: String, required: true },
  year: { type: String, required: true },
  section: { type: String, required: true },
  backlogs: { type: String, required: true },
  companies: { type: [String], required: true, validate: (value) => value.length === 4 },
}, { timestamps: true })

const Registration = mongoose.model('Registration', registrationSchema)

app.get('/api/registrations', async (_request, response) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 }).lean()
    response.json(registrations.map(({ _id, ...registration }) => ({ ...registration, id: _id.toString() })))
  } catch (error) {
    response.status(500).json({ message: 'Could not load registrations.' })
  }
})

app.post('/api/registrations', async (request, response) => {
  try {
    if (Number(request.body.backlogs) > 0 || !Array.isArray(request.body.companies) || request.body.companies.length !== 4) {
      return response.status(400).json({ message: 'Only students with zero backlogs and exactly four companies can register.' })
    }
    const registration = await Registration.create(request.body)
    response.status(201).json({ ...registration.toObject(), id: registration._id.toString() })
  } catch (error) {
    response.status(400).json({ message: 'Could not save registration.' })
  }
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(port, () => console.log(`Server running on http://localhost:${port}`)))
  .catch((error) => console.error('MongoDB connection failed:', error.message))

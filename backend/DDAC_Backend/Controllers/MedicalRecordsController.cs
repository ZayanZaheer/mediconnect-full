using System;
using System.Threading.Tasks;
using DDAC_Backend.DTOs;
using DDAC_Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DDAC_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // /api/medicalrecords
    [AllowAnonymous] 
    public class MedicalRecordsController : ControllerBase
    {
        private readonly IMedicalRecordService _service;

        public MedicalRecordsController(IMedicalRecordService service)
        {
            _service = service;
        }

        // GET: /api/medicalrecords?patientEmail=...
        [HttpGet]
        public async Task<IActionResult> GetRecords([FromQuery] string? patientEmail)
        {
            // If no email given, default to current user (patient)
            var email = patientEmail ?? User.Identity?.Name;

            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Patient email is required." });

            var records = await _service.GetRecordsForPatientAsync(email);
            return Ok(records);
        }

        // GET: /api/medicalrecords/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetRecordById([FromRoute] int id)
        {
            var record = await _service.GetRecordByIdAsync(id);
            if (record == null) return NotFound(new { message = "Record not found." });

            return Ok(record);
        }

        // POST: /api/medicalrecords
        // For now: receives metadata & FileUrl; real file upload can be added later.
        [HttpPost]
        public async Task<IActionResult> CreateRecord([FromBody] CreateMedicalRecordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var created = await _service.CreateRecordAsync(dto);
                return CreatedAtAction(nameof(GetRecordById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // log if you have logger
                return StatusCode(500, new { message = "Error creating medical record.", detail = ex.Message });
            }
        }

        // DELETE: /api/medicalrecords/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteRecord([FromRoute] int id)
        {
            var email = User.Identity?.Name;
            var isAdmin = User.IsInRole("Admin");

            try
            {
                var ok = await _service.DeleteRecordAsync(id, email, isAdmin);
                if (!ok) return NotFound(new { message = "Record not found." });

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting medical record.", detail = ex.Message });
            }
        }
    }
}

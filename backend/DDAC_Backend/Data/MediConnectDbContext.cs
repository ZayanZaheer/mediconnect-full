using Microsoft.EntityFrameworkCore;
using DDAC_Backend.Models;

namespace DDAC_Backend.Data
{
    public class MediConnectDbContext : DbContext
    {
        public MediConnectDbContext(DbContextOptions<MediConnectDbContext> options)
            : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<ConsultationMemo> ConsultationMemos { get; set; }
        public DbSet<Receipt> Receipts { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<DoctorSession> DoctorSessions { get; set; }
        public DbSet<Waitlist> Waitlists { get; set; }
        public DbSet<Receptionist> Receptionists { get; set; } = null!;
        public DbSet<MedicalRecord> MedicalRecords { get; set; }
        public DbSet<MedicalHistoryEntry> MedicalHistoryEntries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Email);
                entity.HasIndex(e => e.NationalId);
                entity.HasIndex(e => e.Role);
                
                entity.HasMany(e => e.AppointmentsAsPatient)
                    .WithOne(e => e.Patient)
                    .HasForeignKey(e => e.PatientEmail)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Doctor
            modelBuilder.Entity<Doctor>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.Specialty);
                
                entity.HasMany(e => e.Appointments)
                    .WithOne(e => e.Doctor)
                    .HasForeignKey(e => e.DoctorId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasMany(e => e.ConsultationMemos)
                    .WithOne(e => e.Doctor)
                    .HasForeignKey(e => e.DoctorId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(e => e.DoctorSession)
                    .WithOne(e => e.Doctor)
                    .HasForeignKey<DoctorSession>(e => e.DoctorId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Appointment
            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PatientEmail);
                entity.HasIndex(e => e.DoctorId);
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => new { e.DoctorId, e.Date, e.Time });
                
                entity.HasOne(e => e.ConsultationMemo)
                    .WithOne(e => e.Appointment)
                    .HasForeignKey<ConsultationMemo>(e => e.AppointmentId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.Receipt)
                    .WithOne(e => e.Appointment)
                    .HasForeignKey<Receipt>(e => e.AppointmentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure ConsultationMemo
            modelBuilder.Entity<ConsultationMemo>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.AppointmentId).IsUnique();
                entity.HasIndex(e => e.DoctorId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => new { e.DoctorId, e.MemoNumber });
            });

            // Configure Receipt
            modelBuilder.Entity<Receipt>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.AppointmentId).IsUnique();
                entity.HasIndex(e => e.DoctorId);
                entity.HasIndex(e => e.PatientEmail);
            });

            // Configure Notification
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.AppointmentId);
                entity.HasIndex(e => e.DoctorId);
                entity.HasIndex(e => e.PatientEmail);
                entity.HasIndex(e => e.CreatedAt);
            });

            // Configure DoctorSession
            modelBuilder.Entity<DoctorSession>(entity =>
            {
                entity.HasKey(e => e.DoctorId);
                entity.HasIndex(e => e.Status);
            });

            // Configure Waitlist
            modelBuilder.Entity<Waitlist>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.DoctorId);
                entity.HasIndex(e => e.PatientEmail);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.PreferredDate);
                
                entity.HasOne<Doctor>()
                    .WithMany()
                    .HasForeignKey(e => e.DoctorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
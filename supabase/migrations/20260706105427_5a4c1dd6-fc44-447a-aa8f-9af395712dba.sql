
UPDATE public.jobs
SET listing_type = 'job'
WHERE listing_type = 'opportunity'
  AND title ~* '\y(coordinator|director|manager|specialist|officer|analyst|engineer|assistant|consultant|advisor|adviser|associate|administrator|architect|developer|designer|writer|editor|producer|strategist|planner|supervisor|technician|accountant|auditor|controller|recruiter|trainer|instructor|programmer|operator|clerk|secretary|treasurer|liaison|facilitator|representative|ambassador|inspector|examiner|reviewer|attorney|counsel|lawyer|nurse|physician|therapist|teacher|professor|researcher|scientist|steward|surveyor|deputy|chief|president)\y'
  AND title !~* '\y(fellowship|fellowships|scholarship|scholarships|bursary|bursaries|prize|prizes|phd|postdoctoral|traineeship|competition|challenge|hackathon|conference|summit|symposium|bootcamp|accelerator|incubator|masterclass|webinar)\y'
  AND title !~* '(call for (applications|proposals|papers|nominations|abstracts))|(internship program(me)?)|(grant program(me)?)|(scholarships? for)|(award program(me)?)|(training program(me)?)|(short course)|(applications open)|(open call)|(apply now for)';

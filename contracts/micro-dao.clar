
;; micro-dao
;;
;; Small contract to manage a simple DAO structure for small teams

;; constants
;;

;; 5 days before an action could be executed if no dissent was put up
(define-constant DISSENT-EXPIRY (* u144 u5))


;; proposal statuses

(define-constant PROPOSED 0)
(define-constant PASSED 1)
(define-constant FAILED 2)

;; membership errors codes start with 1
(define-constant MEMBER-EXISTS 1001)
(define-constant MEMBER-NOT-FOUND 1002)

;; balance error codes start with 2
(define-constant NOT-ENOUGH-FUNDS 2001)

;; auth error codes start with 3
(define-constant NOT-DIRECT-CALLER 3001)
(define-constant NOT-MEMBER 3002)

;; proposal error codes start with 4
(define-constant PROPOSAL-NOT-FOUND 4001)
(define-constant PROPOSAL-DISSENT-EXPIRED 4002)
(define-constant PROPOSAL-FROZEN 4003)

;; initial members of dao
(define-constant INITIAL-MEMBERS 
    (list 
        {address: contract-caller}
        {address: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5}
        {address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG}))

;; data maps and vars
;;

;; members of the DAO who could create funding proposals and manage their balances

(define-map members uint {address: principal})
(define-map member-id-by-address principal uint)
(define-map funding-proposals uint 
    {
        targets: (list 10 
            {
                address: principal,
                amount: uint
            }), 
        proposer: principal,
        created-at: uint,
        status: int
    })


(define-data-var members-count uint u0)
(define-data-var funding-proposals-count uint u0)

;; Funding proposals where we store funding proposals

;; vouch proposals

;; private functions
;;

(define-private (add-member (data {address: principal})) 
    (let
        (
            (current-index (var-get members-count))
        )
        (if (map-insert members current-index data) 
            (begin 
                (map-insert member-id-by-address (get address data) current-index)
                (ok (var-set members-count (+ u1 current-index))))
            (err MEMBER-EXISTS))))

(define-private (get-amount (target {address: principal, amount: uint})) 
    (get amount target))

(define-private (is-member (address principal))
    (is-some (map-get? member-id-by-address address)))

;; public functions
;;

;; get member data

(define-read-only (get-member-data (id uint)) 
    (ok (unwrap! (map-get? members id) (err MEMBER-NOT-FOUND))))



(define-read-only (get-member-id (member-address principal)) 
    (ok (unwrap! (map-get? member-id-by-address member-address) (err MEMBER-NOT-FOUND))))

(define-read-only (get-member-balance (member-id uint)) 
    (ok (/ (get-balance-raw) (var-get members-count))))

;; get balance


(define-read-only (get-balance-raw) 
    (stx-get-balance (as-contract tx-sender)))

(define-read-only (get-balance) 
    (ok (get-balance-raw)))


;; TODO: looks fishy
(define-read-only (is-dissent-passed (created-at uint)) 
    (let (
        (difference (- burn-block-height created-at))
    )
    (>= difference DISSENT-EXPIRY)))
;; propose to add new member


(define-read-only (get-proposal-raw (proposal-id uint)) 
    (map-get? funding-proposals proposal-id))

(define-read-only (get-proposal (proposal-id uint))
    (ok (unwrap! (get-proposal-raw proposal-id) (err PROPOSAL-NOT-FOUND))))

(define-read-only (get-proposal-status (proposal-id uint)) 
    (ok (unwrap! (get status (get-proposal-raw proposal-id)) (err PROPOSAL-NOT-FOUND))))


;; propose a new funding proposal

(define-public (create-funding-proposal (targets (list 10 {address: principal, amount: uint})))
    (let (
            (balance (get-balance-raw))
            (total-amount (fold + (map get-amount targets) u0))
            (current-index (var-get funding-proposals-count))
            (data { targets: targets, proposer: tx-sender, created-at: burn-block-height, status: PROPOSED })
        )
        (asserts! (is-eq contract-caller tx-sender) (err NOT-DIRECT-CALLER))
        (asserts! (is-member tx-sender) (err NOT-MEMBER))
        (asserts! (< total-amount balance) (err NOT-ENOUGH-FUNDS))
        (map-insert funding-proposals current-index data)
        (var-set funding-proposals-count (+ u1 current-index))
        ;; add to funding proposal list
        (ok (merge data {id: current-index}))))


;; dissent on funding proposal

(define-public (dissent (proposal-id uint)) 
    (let (
            (proposal (unwrap! (get-proposal-raw proposal-id) (err PROPOSAL-NOT-FOUND)))
            (created-at (get created-at proposal))
            (status (get status proposal))
        ) 
        (asserts! (is-eq contract-caller tx-sender) (err NOT-DIRECT-CALLER))
        (asserts! (is-member tx-sender) (err NOT-MEMBER))
        (asserts! (not (is-dissent-passed created-at)) (err PROPOSAL-DISSENT-EXPIRED))
        (asserts! (is-eq status PROPOSED) (err PROPOSAL-FROZEN))
        (map-set funding-proposals proposal-id (merge proposal {status: FAILED}))
        
        (ok { id: proposal-id })))


;; execute proposal
;; take a proposal-id 
;; check that:
;; - the creator called the contract directly
;; - 5 days pass
;; - the treasury has enough funds
;; - the executor is a member of the DAO
;; - the proposal had no dissent
;; - the proposal was not executed before
;; get the list of targets to pay off
;; send stx to the targets list 
;; mark proposal as PASSED

;; vote to support funding proposal

;; vote to support adding a new member

;; exit dao


;; INIT
;;


(map add-member INITIAL-MEMBERS)